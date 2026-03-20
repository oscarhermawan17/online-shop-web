'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Check, Truck, PackageCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/public/order-status';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminOrder } from '@/hooks';
import { formatRupiah, formatDate, getOptimizedImageUrl } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const { order, isLoading, isError, mutate } = useAdminOrder(id);
  const [isUpdating, setIsUpdating] = useState(false);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (isError || !order) {
    return (
      <ErrorMessage
        title="Pesanan Tidak Ditemukan"
        message="Pesanan yang Anda cari tidak ditemukan."
        onRetry={() => mutate()}
      />
    );
  }

  const handleConfirmPayment = async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/confirm`);
      toast.success('Pembayaran berhasil dikonfirmasi');
      mutate();
    } catch (error: unknown) {
      console.error('Confirm error:', error);
      toast.error('Gagal mengkonfirmasi pembayaran');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (status: 'shipped' | 'done') => {
    setIsUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast.success(
        status === 'shipped'
          ? 'Pesanan ditandai sebagai dikirim'
          : 'Pesanan selesai'
      );
      mutate();
    } catch (error: unknown) {
      console.error('Update status error:', error);
      toast.error('Gagal mengubah status pesanan');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Detail Pesanan</h1>
            <p className="font-mono text-muted-foreground">
              {order.publicOrderId}
            </p>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nomor HP</p>
                <p className="font-medium">{order.customerPhone}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground">Alamat</p>
                <p className="font-medium">{order.customerAddress}</p>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="font-medium">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variantDescription && (
                        <p className="text-sm text-muted-foreground">
                          Varian: {item.variantDescription}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {formatRupiah(item.price)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatRupiah(item.price * item.quantity)}</p>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatRupiah(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Info Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Tanggal Pesanan</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Batas Pembayaran</p>
                <p className="font-medium">{formatDate(order.expiresAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Proof */}
          {order.paymentProof && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bukti Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={getOptimizedImageUrl(order.paymentProof.imageUrl, 400)}
                    alt="Bukti pembayaran"
                    fill
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Diunggah: {formatDate(order.paymentProof.uploadedAt)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aksi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {order.status === 'waiting_confirmation' && (
                <Button
                  className="w-full"
                  onClick={handleConfirmPayment}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Konfirmasi Pembayaran
                </Button>
              )}
              {order.status === 'paid' && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus('shipped')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Truck className="mr-2 h-4 w-4" />
                  )}
                  Tandai Dikirim
                </Button>
              )}
              {order.status === 'shipped' && (
                <Button
                  className="w-full"
                  onClick={() => handleUpdateStatus('done')}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PackageCheck className="mr-2 h-4 w-4" />
                  )}
                  Selesaikan Pesanan
                </Button>
              )}
              {!['waiting_confirmation', 'paid', 'shipped'].includes(
                order.status
              ) && (
                <p className="text-center text-sm text-muted-foreground">
                  Tidak ada aksi yang tersedia
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
