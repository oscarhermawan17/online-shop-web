'use client';

import { useState } from 'react';
import {
  Check,
  Truck,
  PackageCheck,
  Loader2,
  WalletCards,
} from 'lucide-react';
import { ShipOrderDialog } from '@/components/admin';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { LoadingPage, ErrorMessage, EmptyState, OrderCard } from '@/components/shared';
import { useAdminOrders } from '@/hooks';
import { orderStatusLabels } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

const tabItems: { value: string; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'pending_payment', label: 'Menunggu Bayar' },
  { value: 'waiting_confirmation', label: 'Konfirmasi' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'shipped', label: 'Dikirim' },
  { value: 'done', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
  { value: 'expired_unpaid', label: 'Kadaluarsa' },
];

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const status =
    activeTab === 'all' ? undefined : (activeTab as OrderStatus);

  const { orders, isLoading, isError, mutate } = useAdminOrders(status);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleConfirmPayment = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/confirm`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      mutate();
    } catch {
      toast.error('Gagal mengkonfirmasi pembayaran');
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'shipped' | 'done',
    deliveryMethod: Order['deliveryMethod']
  ) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
      });
      toast.success(
        newStatus === 'shipped'
          ? deliveryMethod === 'pickup'
            ? 'Pengambilan pesanan berhasil dikonfirmasi'
            : 'Pesanan ditandai sebagai dikirim'
          : 'Pesanan selesai'
      );
      mutate();
    } catch {
      toast.error('Gagal mengubah status pesanan');
    } finally {
      setLoadingId(null);
    }
  };

  const handleSettleCredit = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      await api.patch(`/admin/orders/${orderId}/settle-credit`);
      toast.success('Invoice credit berhasil ditandai lunas');
      mutate();
    } catch (error: unknown) {
      console.error('Settle credit error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal melunasi invoice credit');
    } finally {
      setLoadingId(null);
    }
  };

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola semua pesanan masuk dari pelanggan
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
            {orders.length === 0 ? (
              <EmptyState
                type="orders"
                title="Belum Ada Pesanan"
                description={
                  activeTab === 'all'
                    ? 'Pesanan akan muncul di sini ketika ada pembeli.'
                    : `Tidak ada pesanan dengan status "${orderStatusLabels[activeTab] || activeTab}"`
                }
              />
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {orders.length} pesanan
                </p>
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    detailHref={`/admin/orders/${order.id}`}
                    showCustomer
                    showShippingSummary
                    footerActions={
                      <AdminActions
                        order={order}
                        isLoading={loadingId === order.id}
                        onRefresh={() => { mutate() }}
                        onConfirmPayment={handleConfirmPayment}
                        onSettleCredit={handleSettleCredit}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function AdminActions({
  order,
  isLoading,
  onRefresh,
  onConfirmPayment,
  onSettleCredit,
  onUpdateStatus,
}: {
  order: Order;
  isLoading: boolean;
  onRefresh: () => void | Promise<void>;
  onConfirmPayment: (id: string) => void;
  onSettleCredit: (id: string) => void;
  onUpdateStatus: (
    id: string,
    status: 'shipped' | 'done',
    deliveryMethod: Order['deliveryMethod']
  ) => void;
}) {
  const showSettleCredit = order.paymentMethod === 'credit' && !order.creditSettledAt;

  if (
    !showSettleCredit
    && order.status !== 'waiting_confirmation'
    && order.status !== 'paid'
    && order.status !== 'shipped'
  ) {
    return null;
  }

  return (
    <>
      {showSettleCredit && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => onSettleCredit(order.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <WalletCards className="h-4 w-4 mr-1.5" />
          )}
          Lunasi Credit
        </Button>
      )}

      {order.status === 'waiting_confirmation' && (
        <Button
          size="sm"
          onClick={() => onConfirmPayment(order.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <Check className="h-4 w-4 mr-1.5" />
          )}
          Konfirmasi
        </Button>
      )}

      {order.status === 'paid' && (
        order.deliveryMethod === 'delivery' ? (
          <ShipOrderDialog order={order} onSuccess={onRefresh}>
            {({ open, isSubmitting }) => (
              <Button size="sm" onClick={open} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <Truck className="h-4 w-4 mr-1.5" />
                )}
                Kirim
              </Button>
            )}
          </ShipOrderDialog>
        ) : (
          <Button
            size="sm"
            onClick={() => onUpdateStatus(order.id, 'shipped', order.deliveryMethod)}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Check className="h-4 w-4 mr-1.5" />
            )}
            Konfirmasi Pengambilan
          </Button>
        )
      )}

      {order.status === 'shipped' && (
        <Button
          size="sm"
          onClick={() => onUpdateStatus(order.id, 'done', order.deliveryMethod)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <PackageCheck className="h-4 w-4 mr-1.5" />
          )}
          Selesai
        </Button>
      )}
    </>
  );
}
