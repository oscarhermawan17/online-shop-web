'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  Truck,
  PackageCheck,
  Loader2,
  WalletCards,
  MapPin,
  User,
  Phone,
  Clock,
  StickyNote,
  Store,
  CalendarDays,
  UserRound,
} from 'lucide-react';
import { ShipOrderDialog } from '@/components/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from '@/components/public/order-status';
import { LoadingPage, ErrorMessage } from '@/components/shared';
import { useAdminOrder } from '@/hooks';
import {
  formatRupiah,
  formatDate,
  formatDateOnly,
  getOptimizedImageUrl,
  getShippingShiftLabel,
} from '@/lib/utils';
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
  const productSubtotalAfterDiscount = Math.max(0, order.totalAmount - (order.shippingCost || 0));
  const totalProductDiscount = order.items.reduce((sum, item) => {
    const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
      ? item.originalPrice
      : item.price;
    const computedLineDiscount = Math.max(0, (originalUnitPrice - item.price) * item.quantity);
    const lineDiscount = typeof item.discountAmount === 'number'
      ? item.discountAmount
      : computedLineDiscount;
    return sum + lineDiscount;
  }, 0);
  const productSubtotalBeforeDiscount = productSubtotalAfterDiscount + totalProductDiscount;

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

  const handleSettleCredit = async () => {
    setIsUpdating(true);
    try {
      await api.patch(`/admin/orders/${id}/settle-credit`);
      toast.success('Invoice credit berhasil ditandai lunas');
      mutate();
    } catch (error: unknown) {
      console.error('Settle credit error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Gagal melunasi invoice credit');
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
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-2.5">
                  <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nama</p>
                    <p className="text-sm font-medium">{order.customerName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nomor HP</p>
                    <p className="text-sm font-medium">{order.customerPhone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  {order.deliveryMethod === 'delivery'
                    ? <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    : <Store className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-xs text-muted-foreground">Metode</p>
                    <p className="text-sm font-medium">
                      {order.deliveryMethod === 'delivery' ? 'Dikirim' : 'Ambil di Toko'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <WalletCards className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pembayaran</p>
                    <p className="text-sm font-medium">
                      {order.paymentMethod === 'credit' ? 'Credit' : 'Transfer Bank'}
                    </p>
                  </div>
                </div>
              </div>

              {order.customerAddress && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {order.deliveryMethod === 'delivery' ? 'Alamat Pengiriman' : 'Lokasi Toko'}
                      </p>
                      <p className="text-sm font-medium">{order.customerAddress}</p>
                    </div>
                  </div>
                </>
              )}

              {order.deliveryMethod === 'delivery' && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimasi Tiba</p>
                      <p className="text-sm font-medium">
                        {(() => {
                          const created = new Date(order.createdAt);
                          const end = new Date(created.getTime() + 2 * 24 * 60 * 60 * 1000);
                          const fmt = (d: Date) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                          return `${fmt(created)} - ${fmt(end)}`;
                        })()}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {order.shippingAssignment && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-start gap-2.5">
                      <Truck className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Shift Pengiriman
                        </p>
                        <p className="text-sm font-medium">
                          {getShippingShiftLabel({
                            name: order.shippingAssignment.shiftName,
                            startTime: order.shippingAssignment.shiftStartTime,
                            endTime: order.shippingAssignment.shiftEndTime,
                            shiftLabel: order.shippingAssignment.shiftLabel,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex items-start gap-2.5">
                        <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Tanggal Pengiriman
                          </p>
                          <p className="text-sm font-medium">
                            {formatDateOnly(order.shippingAssignment.deliveryDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <UserRound className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Driver / Kurir
                          </p>
                          <p className="text-sm font-medium">
                            {order.shippingAssignment.driverName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {order.notes && (
                <>
                  <Separator />
                  <div className="flex items-start gap-2.5">
                    <StickyNote className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Catatan</p>
                      <p className="text-sm font-medium">{order.notes}</p>
                    </div>
                  </div>
                </>
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
                {order.items.map((item) => {
                  const originalUnitPrice = item.originalPrice && item.originalPrice > item.price
                    ? item.originalPrice
                    : item.price;
                  const lineSubtotal = originalUnitPrice * item.quantity;
                  const lineTotal = item.price * item.quantity;
                  const computedLineDiscount = Math.max(0, lineSubtotal - lineTotal);
                  const lineDiscount = typeof item.discountAmount === 'number'
                    ? item.discountAmount
                    : computedLineDiscount;
                  const hasDiscount = lineDiscount > 0;

                  return (
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
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatRupiah(originalUnitPrice)} x {item.quantity}
                            </p>
                            <p className="text-sm text-green-600">
                              {formatRupiah(item.price)} x {item.quantity}
                            </p>
                            <p className="text-xs text-green-600">
                              Diskon: -{formatRupiah(lineDiscount)}
                              {item.discountRuleName ? ` (${item.discountRuleName})` : ''}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {formatRupiah(item.price)} x {item.quantity}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {hasDiscount ? (
                          <>
                            <p className="text-sm text-muted-foreground line-through">
                              {formatRupiah(lineSubtotal)}
                            </p>
                            <p className="font-semibold">{formatRupiah(lineTotal)}</p>
                          </>
                        ) : (
                          <p className="font-semibold">{formatRupiah(lineTotal)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Separator />

                <div className="space-y-2">
                  {totalProductDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal Awal</span>
                        <span>{formatRupiah(productSubtotalBeforeDiscount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Diskon Produk</span>
                        <span className="font-medium text-green-600">
                          -{formatRupiah(totalProductDiscount)}
                        </span>
                      </div>
                    </>
                  ) : null}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal Produk</span>
                    <span>{formatRupiah(productSubtotalAfterDiscount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ongkos Kirim</span>
                    <span>
                      {order.deliveryMethod === 'delivery' && order.shippingCost > 0
                        ? formatRupiah(order.shippingCost)
                        : order.deliveryMethod === 'pickup'
                          ? 'Gratis (Ambil di Toko)'
                          : 'Gratis'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
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
                <p className="font-medium">
                  {order.expiresAt ? formatDate(order.expiresAt) : 'Tidak ada batas transfer'}
                </p>
              </div>
              {order.paymentMethod === 'credit' && (
                <div>
                  <p className="text-sm text-muted-foreground">Status Invoice Credit</p>
                  <p className="font-medium">
                    {order.creditSettledAt ? `Lunas pada ${formatDate(order.creditSettledAt)}` : 'Belum lunas'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {order.paymentMethod === 'credit' && !order.creditSettledAt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Invoice Credit</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Order ini memakai metode pembayaran credit. Nilai order masih dihitung sebagai credit terpakai sampai ditandai lunas.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Payment Proof */}
          {order.paymentProof && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bukti Pembayaran</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-muted">
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
              {order.paymentMethod === 'credit' && !order.creditSettledAt && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleSettleCredit}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Lunasi Credit
                </Button>
              )}
              {order.status === 'paid' && (
                order.deliveryMethod === 'delivery' ? (
                  <ShipOrderDialog
                    order={order}
                    onSuccess={async () => {
                      await mutate();
                    }}
                  >
                    {({ open, isSubmitting }) => (
                      <Button
                        className="w-full"
                        onClick={open}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Truck className="mr-2 h-4 w-4" />
                        )}
                        Jadwalkan Pengiriman
                      </Button>
                    )}
                  </ShipOrderDialog>
                ) : (
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
                )
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
              ) && !(order.paymentMethod === 'credit' && !order.creditSettledAt) && (
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
