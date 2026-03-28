'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { OrderStatusBadge } from '@/components/public/order-status';
import { useCustomerAuthStore } from '@/stores';
import { fetcher } from '@/lib/api';
import type { Order } from '@/types/order';
import useSWR from 'swr';

export default function DashboardPage() {
  const router = useRouter();
  const customer = useCustomerAuthStore((state) => state.customer);
  const logout = useCustomerAuthStore((state) => state.logout);

  const { data: orders, isLoading } = useSWR<Order[]>('/customer/orders', fetcher);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{customer?.name ?? 'Pengguna'}</p>
              <p className="text-sm text-muted-foreground">{customer?.phone}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">Riwayat Pesanan</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : !orders || orders.length === 0 ? (
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
              <Card key={order.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      #{order.publicOrderId}
                    </CardTitle>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
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
