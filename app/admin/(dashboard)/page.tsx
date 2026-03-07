'use client';

import { Package, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import { StatsCard, OrderTable } from '@/components/admin';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminProducts, useAdminOrders } from '@/hooks';
import { formatRupiah } from '@/lib/utils';

export default function AdminDashboardPage() {
  const { products, isLoading: productsLoading, isError: productsError } = useAdminProducts();
  const { orders, isLoading: ordersLoading, isError: ordersError, mutate: mutateOrders } = useAdminOrders();

  if (productsLoading || ordersLoading) {
    return <LoadingPage />;
  }

  if (productsError || ordersError) {
    return (
      <ErrorMessage
        title="Gagal Memuat Data"
        message="Tidak dapat memuat data dashboard"
        onRetry={() => {
          mutateOrders();
        }}
      />
    );
  }

  // Calculate stats
  const totalProducts = products.length;
  const pendingPayments = orders.filter(
    (o) => o.status === 'pending_payment' || o.status === 'waiting_confirmation'
  ).length;
  const totalRevenue = orders
    .filter((o) => o.status === 'paid' || o.status === 'shipped' || o.status === 'done')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Selamat datang di panel admin toko Anda
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Produk"
          value={totalProducts}
          icon={Package}
        />
        <StatsCard
          title="Total Pesanan"
          value={orders.length}
          icon={ShoppingCart}
        />
        <StatsCard
          title="Menunggu Pembayaran"
          value={pendingPayments}
          icon={Clock}
        />
        <StatsCard
          title="Total Pendapatan"
          value={formatRupiah(totalRevenue)}
          icon={TrendingUp}
        />
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pesanan Terbaru</h2>
        {recentOrders.length > 0 ? (
          <OrderTable orders={recentOrders} onUpdate={() => mutateOrders()} />
        ) : (
          <p className="text-muted-foreground">Belum ada pesanan</p>
        )}
      </div>
    </div>
  );
}
